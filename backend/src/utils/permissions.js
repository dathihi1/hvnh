const prisma = require("../config/prisma");
const { ORG_MEMBER_ROLE } = require("./constants");

const isOrgLeader = async (organizationId, userId) => {
  const member = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      userId,
      role: ORG_MEMBER_ROLE.PRESIDENT,
      isDeleted: false,
    },
  });
  return !!member;
};

const isOrgMember = async (organizationId, userId) => {
  const member = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      userId,
      isDeleted: false,
    },
  });
  return !!member;
};

const isAdminOrOrgLeader = async (roles, organizationId, userId) => {
  if (roles.includes("admin")) return true;
  return isOrgLeader(organizationId, userId);
};

module.exports = {
  isOrgLeader,
  isOrgMember,
  isAdminOrOrgLeader,
};
