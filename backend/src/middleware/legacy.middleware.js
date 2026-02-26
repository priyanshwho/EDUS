/**
 * Legacy Drive content protection.
 *
 * Professors CANNOT edit resources that are legacy Drive links
 * (external_link populated, aws_s3_key null).
 * Only admins may touch legacy content.
 */
function blockProfessorOnLegacy(resource) {
  return (req, res, next) => {
    if (!resource) return next(); // nothing to check yet
    const isLegacy = resource.external_link && !resource.aws_s3_key;
    if (isLegacy && req.user?.role === 'professor') {
      return res.status(403).json({
        error: 'Professors cannot modify legacy Google Drive content',
      });
    }
    next();
  };
}

module.exports = { blockProfessorOnLegacy };
