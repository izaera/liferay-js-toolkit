Liferay.PATHS = {
  "<%= pkgJson.id %>": "<%= params.contextPath %>"
};
Liferay.MODULES = {
  "<%= pkgJson.id %>/<%= pkgJson.main %>": {
    dependencies: []
  }
};
Liferay.MAPS = {
  "<%= pkgJson.id %>": {
    exactMatch: true,
    value: "<%= pkgJson.id %>/<%= pkgJson.main %>"
  }
};
Liferay.EXPLAIN_RESOLUTIONS = false;
Liferay.EXPOSE_GLOBAL = false;
Liferay.WAIT_TIMEOUT = 5000; //30000;
