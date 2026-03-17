const prisma = require("../../config/prisma");

/**
 * ======================================
 * Create Organization
 * ======================================
 */

const createOrganizationService = async (data) => {
  //chỉ admin mới có thể tạo organization
  // if (!user || user.role !== "admin") {
  //   throw new Error("Only admin can create organization");
  // }

  // kiểm tra trùng tên và chuẩn hóa tên
  const name = data.organizationName.trim().toLowerCase();
  const existingOrg = await prisma.organization.findFirst({
    where: {
      organizationName: data.organizationName,
      isDeleted: false,
    },
  });

  if (existingOrg) {
    throw new Error("Organization name already exists");
  }

  return prisma.organization.create({
    data: {
      organizationName: data.organizationName,
      organizationType: data.organizationType,
      logoUrl: data.logoUrl,
      coverImageUrl: data.coverImageUrl,
      description: data.description,
    },
  });
};

/**
 * ======================================
 * Get Organizations, mặc định lấy ra 10 organizations mới nhất
 * ======================================
 */
const getOrganizationsService = async (limit = 10) => {
  // if (!user || user.role !== "admin") {
  //   throw new Error("Only admin can get organization");
  // }
  return prisma.organization.findMany({
    where: {
      isDeleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit, // chỉ lấy limit bản ghi
  });
};

/**
 * ======================================
 * Get Organization By ID
 * ======================================
 */
const getOrganizationByIdService = async (organizationId, user) => {
  // if (!user || user.role !== "admin") {
  //   throw new Error("Only admin can get organization");
  // }

  return prisma.organization.findFirst({
    where: {
      organizationId: Number(organizationId),
      isDeleted: false,
    },
  });
};
//GET theo name

const getOrganizationsServiceByName = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const skip = (page - 1) * limit;

  const where = {
    isDeleted: false,
  };

  if (query.name) {
    where.organizationName = {
      contains: query.name,
      mode: "insensitive", // không phân biệt hoa thường
    };
  }

  return prisma.organization.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });
};
//get by type

const getOrganizationsServiceByType = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const skip = (page - 1) * limit;

  const where = {
    isDeleted: false,
  };

  if (query.name) {
    where.organizationType = {
      contains: query.type,
      mode: "insensitive", // không phân biệt hoa thường
    };
  }

  return prisma.organization.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });
};
/**
 * ======================================
 * Update Organization
 * ======================================
 */

const updateOrganizationService = async (organizationId, data) => {
  return prisma.organization.update({
    where: {
      organizationId,
    },
    data: {
      organizationName: data.organizationName,
      organizationType: data.organizationType,
      logoUrl: data.logoUrl,
      coverImageUrl: data.coverImageUrl,
      description: data.description,
      updatedAt: new Date(),
    },
  });
};

/**
 * ======================================
 * Soft Delete Organization
 * ======================================
 */
const deleteOrganizationService = async (organizationId) => {
  return prisma.organization.update({
    where: {
      organizationId,
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

module.exports = {
  createOrganizationService,
  getOrganizationsService,
  getOrganizationByIdService,
  getOrganizationsServiceByName,
  getOrganizationsServiceByType,
  updateOrganizationService,
  deleteOrganizationService,
};
