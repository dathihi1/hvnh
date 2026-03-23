const prisma = require("../../config/prisma");
const AppError = require("../../utils/app-error");
const cache = require("../../utils/cache");
const { CONFIG_DEFAULTS } = require("../../utils/constants");

const CONFIG_TTL = 600; // 10 min

// ─── Helpers ────────────────────────────────────────────────────────────────

const globalCacheKey = (key) => `${cache.REDIS_PREFIX.SYSTEM_CONFIG}${key}`;
const orgCacheKey = (key, orgId) => `${cache.REDIS_PREFIX.SYSTEM_CONFIG}${key}:org:${orgId}`;

// ─── Get config value (with org override -> global -> default fallback) ──────

const getConfig = async (key, organizationId) => {
  // 1. Try org-specific override
  if (organizationId) {
    const ck = orgCacheKey(key, organizationId);
    const cached = await cache.get(ck);
    if (cached !== null) return cached;

    const orgConfig = await prisma.systemConfig.findFirst({
      where: { key, organizationId: Number(organizationId), isDeleted: false },
    });

    if (orgConfig) {
      await cache.set(ck, orgConfig.value, CONFIG_TTL);
      return orgConfig.value;
    }
  }

  // 2. Try global config
  const gk = globalCacheKey(key);
  const cached = await cache.get(gk);
  if (cached !== null) return cached;

  const globalConfig = await prisma.systemConfig.findFirst({
    where: { key, organizationId: null, isDeleted: false },
  });

  if (globalConfig) {
    await cache.set(gk, globalConfig.value, CONFIG_TTL);
    return globalConfig.value;
  }

  // 3. Fallback to hardcoded default
  return CONFIG_DEFAULTS[key] || null;
};

// ─── Get all global configs ─────────────────────────────────────────────────

const getAllConfigs = async () => {
  return prisma.systemConfig.findMany({
    where: { organizationId: null, isDeleted: false },
    orderBy: [{ category: "asc" }, { key: "asc" }],
  });
};

// ─── Get configs by category ────────────────────────────────────────────────

const getConfigsByCategory = async (category) => {
  return prisma.systemConfig.findMany({
    where: { category, organizationId: null, isDeleted: false },
    orderBy: { key: "asc" },
  });
};

// ─── Get single config by key ───────────────────────────────────────────────

const getConfigByKey = async (key, organizationId) => {
  if (organizationId) {
    const orgConfig = await prisma.systemConfig.findFirst({
      where: { key, organizationId: Number(organizationId), isDeleted: false },
      include: { organization: { select: { organizationId: true, organizationName: true } } },
    });
    if (orgConfig) return orgConfig;
  }

  const globalConfig = await prisma.systemConfig.findFirst({
    where: { key, organizationId: null, isDeleted: false },
  });

  if (!globalConfig) throw new AppError("NOT_FOUND", `Config '${key}' not found`);
  return globalConfig;
};

// ─── Get all overrides for a specific config key ────────────────────────────

const getOverridesByKey = async (key) => {
  return prisma.systemConfig.findMany({
    where: { key, organizationId: { not: null }, isDeleted: false },
    include: { organization: { select: { organizationId: true, organizationName: true } } },
    orderBy: { organizationId: "asc" },
  });
};

// ─── Update or create config (transactional) ────────────────────────────────

const updateConfig = async (key, value, updatedBy, organizationId) => {
  const orgId = organizationId ? Number(organizationId) : null;

  const config = await prisma.$transaction(async (tx) => {
    const existing = await tx.systemConfig.findFirst({
      where: { key, organizationId: orgId, isDeleted: false },
    });

    if (existing) {
      await tx.systemLog.create({
        data: {
          action: `config.update.${key}`,
          oldData: JSON.stringify(existing.value),
          newData: JSON.stringify(value),
          userId: updatedBy,
        },
      });

      return tx.systemConfig.update({
        where: { configId: existing.configId },
        data: { value, updatedBy, updatedAt: new Date() },
      });
    }

    if (orgId) {
      const globalConfig = await tx.systemConfig.findFirst({
        where: { key, organizationId: null, isDeleted: false },
      });

      const org = await tx.organization.findFirst({
        where: { organizationId: orgId, isDeleted: false },
      });
      if (!org) throw new AppError("ORGANIZATION_NOT_FOUND");

      const created = await tx.systemConfig.create({
        data: {
          key,
          value,
          dataType: globalConfig?.dataType ?? "json",
          category: globalConfig?.category ?? key.split(".")[0],
          label: globalConfig?.label ?? key,
          description: globalConfig?.description ?? null,
          organizationId: orgId,
          createdBy: updatedBy,
        },
      });

      await tx.systemLog.create({
        data: {
          action: `config.create_override.${key}.org.${orgId}`,
          oldData: null,
          newData: JSON.stringify(value),
          userId: updatedBy,
        },
      });

      return created;
    }

    throw new AppError("NOT_FOUND", `Config '${key}' not found`);
  });

  // Invalidate cache after successful transaction
  await cache.del(globalCacheKey(key));
  if (orgId) {
    await cache.del(orgCacheKey(key, orgId));
  } else {
    // Global config changed — invalidate all org caches that may fall through
    await cache.invalidateByPrefix(`${cache.REDIS_PREFIX.SYSTEM_CONFIG}${key}:org:`);
  }

  return config;
};

// ─── Get org overrides ──────────────────────────────────────────────────────

const getOrgOverrides = async (organizationId) => {
  return prisma.systemConfig.findMany({
    where: { organizationId: Number(organizationId), isDeleted: false },
    orderBy: { key: "asc" },
    include: { organization: { select: { organizationId: true, organizationName: true } } },
  });
};

// ─── Delete org override (transactional) ─────────────────────────────────

const deleteOrgOverride = async (key, organizationId, deletedBy) => {
  const orgIdNum = Number(organizationId);

  await prisma.$transaction(async (tx) => {
    const config = await tx.systemConfig.findFirst({
      where: { key, organizationId: orgIdNum, isDeleted: false },
    });

    if (!config) throw new AppError("NOT_FOUND", `Org override for '${key}' not found`);

    await tx.systemLog.create({
      data: {
        action: `config.delete_override.${key}.org.${organizationId}`,
        oldData: JSON.stringify(config.value),
        newData: null,
        userId: deletedBy,
      },
    });

    await tx.systemConfig.update({
      where: { configId: config.configId },
      data: { isDeleted: true, deletedAt: new Date(), deletedBy },
    });
  });

  await cache.del(orgCacheKey(key, orgIdNum));

  return { message: "Override removed" };
};

// ─── Org-leader self-service (auto-resolves their own org) ──────────────────

const ORG_LEADER_ROLES = ["president", "vice_president", "head_of_department", "vice_head", "leader"];

const getMyOrgConfig = async (key, userId) => {
  const member = await prisma.organizationMember.findFirst({
    where: { userId, role: { in: ORG_LEADER_ROLES }, isDeleted: false },
  });
  if (!member) throw new AppError("FORBIDDEN", "Bạn không phải thành viên lãnh đạo của tổ chức nào");
  return getConfigByKey(key, member.organizationId);
};

const updateMyOrgConfig = async (key, value, userId) => {
  const member = await prisma.organizationMember.findFirst({
    where: { userId, role: { in: ORG_LEADER_ROLES }, isDeleted: false },
  });
  if (!member) throw new AppError("FORBIDDEN", "Bạn không phải thành viên lãnh đạo của tổ chức nào");
  return updateConfig(key, value, userId, member.organizationId);
};

module.exports = {
  getConfig,
  getAllConfigs,
  getConfigsByCategory,
  getConfigByKey,
  getOverridesByKey,
  updateConfig,
  getOrgOverrides,
  deleteOrgOverride,
  getMyOrgConfig,
  updateMyOrgConfig,
};
