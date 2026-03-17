const {
  createOrganizationService,
  getOrganizationsService,
  getOrganizationByIdService,
  getOrganizationsServiceByName,
  getOrganizationsServiceByType,
  updateOrganizationService,
  deleteOrganizationService,
} = require("./organizations.service");

/**
 * ======================================
 * Create Organization
 * ======================================
 */
const createOrganizationController = async (req, res, next) => {
  try {
    const organization = await createOrganizationService(req.body, req.user);

    res.status(201).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ======================================
 * Get Organizations
 * ======================================
 */
const getOrganizationsController = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const organizations = await getOrganizationsService(limit);

    res.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ======================================
 * Get Organization By ID
 * ======================================
 */
const getOrganizationByIdController = async (req, res, next) => {
  try {
    const { organizationId } = req.params;

    const organization = await getOrganizationByIdService(
      Number(organizationId),
    );

    res.json({
      success: true,
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};
//Get Organization by name
const getOrganizationsByNameController = async (req, res) => {
  try {
    const organizations = await getOrganizationsServiceByName(req.query);

    return res.status(200).json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.log(req.query);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
//get Organizations by type
const getOrganizationsByTypeController = async (req, res) => {
  try {
    const organizations = await getOrganizationsServiceByType(req.query);

    return res.status(200).json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.log(req.query);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * ======================================
 * Update Organization
 * ======================================
 */
const updateOrganizationController = async (req, res, next) => {
  try {
    const { organizationId } = req.params;

    const organization = await updateOrganizationService(
      Number(organizationId),
      req.body,
    );

    res.json({
      success: true,
      data: organization,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ======================================
 * Delete Organization (Soft Delete)
 * ======================================
 */
const deleteOrganizationController = async (req, res, next) => {
  try {
    const { organizationId } = req.params;

    await deleteOrganizationService(Number(organizationId));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrganizationController,
  getOrganizationsController,
  getOrganizationByIdController,
  getOrganizationsByNameController,
  getOrganizationsByTypeController,
  updateOrganizationController,
  deleteOrganizationController,
};
