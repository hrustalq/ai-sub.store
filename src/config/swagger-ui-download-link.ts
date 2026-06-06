export const SWAGGER_JSON_PATH = 'api/docs-json';
export const SWAGGER_OPENAPI_FILENAME = 'ai-sub-store-openapi.json';

export const SWAGGER_DOWNLOAD_LINK_CSS = `
.swagger-ui .topbar .wrapper {
  display: flex;
  align-items: center;
  max-width: 100%;
}

.swagger-ui .topbar .download-schema-link {
  margin-left: auto;
  margin-right: 16px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}

.swagger-ui .topbar .download-schema-link:hover {
  text-decoration: underline;
}
`;

export const SWAGGER_DOWNLOAD_LINK_JS = `
(function () {
  var jsonPath = '/${SWAGGER_JSON_PATH}';
  var filename = '${SWAGGER_OPENAPI_FILENAME}';

  function injectDownloadLink() {
    var wrapper = document.querySelector('.swagger-ui .topbar .wrapper');
    if (!wrapper || wrapper.querySelector('.download-schema-link')) {
      return false;
    }

    var link = document.createElement('a');
    link.className = 'download-schema-link';
    link.href = jsonPath;
    link.setAttribute('download', filename);
    link.textContent = 'Скачать OpenAPI схему';
    wrapper.appendChild(link);
    return true;
  }

  function watchForTopbar() {
    if (injectDownloadLink()) {
      return;
    }

    var root = document.getElementById('swagger-ui');
    if (!root) {
      return;
    }

    var observer = new MutationObserver(function () {
      if (injectDownloadLink()) {
        observer.disconnect();
      }
    });

    observer.observe(root, { childList: true, subtree: true });
  }

  window.addEventListener('load', watchForTopbar);
})();
`;
