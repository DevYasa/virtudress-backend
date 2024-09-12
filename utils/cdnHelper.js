exports.getCdnUrl = (path) => {
    const cdnBaseUrl = process.env.CDN_BASE_URL || '';
    return `${cdnBaseUrl}${path}`;
  };