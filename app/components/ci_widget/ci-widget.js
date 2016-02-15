const React = require('react');
const moment = require('moment');
const _ = require('underscore');

import {apiHost} from '../../config/globals';

require('./ci-widget.scss');

const maxBuildHistory = 4;
const CiWidget = React.createClass({
  propTypes: {
    title: React.PropTypes.string.isRequired,
    widgetPath: React.PropTypes.string.isRequired,
    status: React.PropTypes.oneOf(['passed', 'failed', 'building', 'unknown']).isRequired,
    committer: React.PropTypes.string.isRequired,
    lastBuildTime: React.PropTypes.string.isRequired,
    buildHistory: React.PropTypes.array.isRequired
  },

  getDefaultProps: function() {
    return {
      status: 'unknown',
      buildHistory: [ ]
    };
  },

  committerInfo: function() {
    if (this.props.committer) {
      const committerName = this.props.committer;
      const fomattedCommitterName = (committerName.length > 20) ?
        (committerName.substring(0, 17) + '...') :
        committerName;
      return ('by ' + fomattedCommitterName);
    }
  },

  timeAgo: function(timestamp) {
    return moment(timestamp).fromNow();
  },

  showCommitter: function() {
    return (this.props.status === 'failed' ? '' : 'hidden');
  },

  renderBuildHistory: function() {
    const buildHistory = this.props.buildHistory;
    return _.map(_.range(maxBuildHistory), function(index) {
      const build = buildHistory ? buildHistory[maxBuildHistory - (index + 1)] : null;
      const buildStatus = build ? build.state : 'unknown';
      return ( <div className={'build-block ' + buildStatus }></div>);
    });
  },

  deleteWidget: function() {
    let data = new FormData();
    data.append('_method', 'delete');

    const url = apiHost + this.props.widgetPath;
    const options = {
      method: 'post',
      mode: 'no-cors',
      body: data,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
    debugger;
    window.fetch(url, options).then(function(response) {
      console.log(response);
    });
  },

  render: function() {
    return (
      <div className={'inner-ci-widget ' + this.props.status}>
        <div className="content">
          <p className="project-name">{this.props.title}</p>
          <div className="symbol"></div>
          <div className="commit-info">
            <div className="inner-div">
              <p className="last-build-at">{this.timeAgo(this.props.lastBuildTime)}</p>
              <p className={ 'committer ' + this.showCommitter() }>{this.committerInfo()}</p>
            </div>
          </div>
          <div className="build-history">
            {this.renderBuildHistory()}
          </div>

          <div className="buttons edit-only">
            <a className="delete btn-floating waves-effect waves-light white-text red tooltipped"
              data-tooltip="Remove Widget"
              rel="nofollow"
              href="javascript:void(0);"
              onClick={this.deleteWidget}>
              <i className="tiny material-icons">delete</i>
            </a>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = CiWidget;