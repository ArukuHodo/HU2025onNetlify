var GitHubAPI = (function() {
  var GitHubAPI = function(user, repo, token, option) {
    this.user = user;
    this.repo = repo;
    this.token = token;
    this.option = option || {};
    this.baseUrl = 'https://api.github.com/repos/' + user + '/' + repo;
  };

  GitHubAPI.prototype.request = function(path, method, payload) {
    var url = this.baseUrl + path;
    var options = {
      method: method,
      muteHttpExceptions: true,
      headers: {
        'Authorization': 'token ' + this.token,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': this.user
      }
    };
    if (payload) options.payload = JSON.stringify(payload);
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    var body = response.getContentText();
    if (code < 200 || code >= 300) {
      Logger.log('GitHub API Error: ' + code + ' ' + body);
      throw new Error('GitHub API Error: ' + code + ' ' + body);
    }
    return JSON.parse(body);
  };

  GitHubAPI.prototype.getBranch = function(branch) {
    return this.request('/branches/' + branch, 'get');
  };

  GitHubAPI.prototype.getTree = function(treeSha) {
    return this.request('/git/trees/' + treeSha, 'get');
  };

  GitHubAPI.prototype.createBlob = function(content) {
    return this.request('/git/blobs', 'post', { content: content, encoding: 'utf-8' });
  };

  GitHubAPI.prototype.createTree = function(data) {
    return this.request('/git/trees', 'post', data);
  };

  GitHubAPI.prototype.createCommit = function(message, treeSha, parentSha) {
    var author = this.option;
    return this.request('/git/commits', 'post', {
      message: message,
      tree: treeSha,
      parents: [parentSha],
      author: author
    });
  };

  GitHubAPI.prototype.updateReference = function(branch, commitSha) {
    return this.request('/git/refs/heads/' + branch, 'patch', { sha: commitSha });
  };

  return {
    GitHubAPI: GitHubAPI
  };
})();
