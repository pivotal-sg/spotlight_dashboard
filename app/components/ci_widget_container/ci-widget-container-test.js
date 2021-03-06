const React = require('react');
const TestUtils = require('react/lib/ReactTestUtils');

const chai = require('chai');
const expect = require('chai').expect;
const sinonChai = require('sinon-chai');

chai.use(sinonChai);

const CiWidgetContainer = require('./ci-widget-container');
const CiWidget = require('../ci_widget/ci-widget');

describe('CiWidgetContainer', function() {
  let fakeTimerTick;
  let fakeFetch;
  let component;

  const widgetProps = {
    title: 'Concierge',
    widgetPath: '/widget_path',
    uuid: 'some uuid'
  };

  beforeEach(function() {
    component = TestUtils.renderIntoDocument(<CiWidgetContainer {...widgetProps}/>);
  });

  it('passes its title to the CI widget component', function() {
    const ciWidget = TestUtils.findRenderedComponentWithType(component, CiWidget);
    expect(ciWidget.props.title).to.equal(widgetProps.title);
  });

  it('adds uuid as a data-element on the parent', function() {
    const containerNode = TestUtils.findRenderedDOMComponentWithClass(component, 'ci-widget');
    expect(containerNode.dataset.uuid).to.equal(widgetProps.uuid);
  });

  describe('refreshes the build', function() {
    const fakeCIStatusResponse = { foo: 1 };
    const onBuildUpdateSpy = sinon.spy();

    beforeEach( function() {
      const res = new window.Response(JSON.stringify(fakeCIStatusResponse), {
        status: 200,
        headers: {
          'Content-type': 'application/json'
        }
      });

      fakeFetch = sinon.stub(window, 'fetch');
      window.fetch.returns(Promise.resolve(res));

      component = TestUtils.renderIntoDocument( <CiWidgetContainer { ...widgetProps } onBuildUpdate={onBuildUpdateSpy} />);
    });

    afterEach(function() {
      window.fetch.restore();
    });

    it("updates itself with the CI response info", function(done) {
      setTimeout(function(){
        expect(onBuildUpdateSpy.calledWith(fakeCIStatusResponse)).to.equal(true)
        done();
      });
    });
  });


  describe('build information', function() {
    let fakeOnBuildUpdate;
    const res = new window.Response('{"hello":"world"}', {
      status: 200,
      headers: {
        'Content-type': 'application/json'
      }
    });

    beforeEach( function() {
      fakeOnBuildUpdate = sinon.spy();
      fakeTimerTick = sinon.spy();
      component = TestUtils.renderIntoDocument(
        <CiWidgetContainer {...widgetProps}
        onBuildUpdate={fakeOnBuildUpdate}
        timerTick={fakeTimerTick}/>
      );
      fakeFetch = sinon.stub(window, 'fetch');
      window.fetch.returns(Promise.resolve(res));
    });

    afterEach(function() {
      window.fetch.restore();
    });

    it('calls the server to get latest build data', function() {
      component.refreshBuildInfo();

      const callArgs = fakeFetch.args[0];
      const url = callArgs[0];
      const options = callArgs[1];
      expect(url).to.contain('/api/ci_status/' + widgetProps.uuid);
      expect(options.method).to.equal('GET');
    });

    it('calls the onBuildUpdate function upon completing the fetch', function(done) {
      component.refreshBuildInfo();
      done();
      // to make sure that mocha proceeds with success callback.
      expect(fakeOnBuildUpdate.callCount).to.equal(1);
    });
  });

  describe('updateBuildInfo', function() {
    const testBuildInfo = {
      state: 'passed',
      committer: 'Luke Skywalker',
      timestamp: 'A long time ago'
    };

    const olderBuildInfo = {
      state: 'failed',
      committer: 'Anakin Skywalker',
      timestamp: 'A longer time ago'
    };

    const buildInfo = {
      status: {
        build_history: [testBuildInfo, olderBuildInfo]
      }
    };

    it('updates the component state', function() {
      component.onBuildUpdate(buildInfo);
      expect(component.state.status).to.equal(testBuildInfo.state);
      expect(component.state.committer).to.equal(testBuildInfo.committer);
      expect(component.state.lastBuildTime).to.equal(testBuildInfo.timestamp);
      expect(component.state.buildHistory[0]).to.equal(testBuildInfo);
      expect(component.state.buildHistory[1]).to.equal(olderBuildInfo);
      expect(component.state.buildHistory.length).to.equal(2);
    });
  });

  describe('componentDidMount', function() {
    let clock;

    beforeEach(function() {
      fakeTimerTick = sinon.spy();
      clock = sinon.useFakeTimers();
    });

    afterEach(function() {
      clock.restore();
    });

    it('causes the timerTick to be called at interval', function() {
      const refreshRate = 20000;
      component = TestUtils.renderIntoDocument(
        <CiWidgetContainer {...widgetProps} timerTick={fakeTimerTick} refreshInterval={refreshRate}/>
      );

      expect(fakeTimerTick.callCount).to.equal(1);

      clock.tick(refreshRate - 1);
      expect(fakeTimerTick.callCount).to.equal(1);

      clock.tick(2);
      expect(fakeTimerTick.callCount).to.equal(2);
    });
  });

  it('passes the build status from its state to the CI widget component', function() {
    const expectedProps = {status: 'status', committer: 'committer name', lastBuildTime: 'last build', buildHistory: [{foo: 'bar'}]};
    component.setState(expectedProps);

    const ciWidget = TestUtils.findRenderedComponentWithType(component, CiWidget);
    expect(ciWidget.props).to.contain(expectedProps);
  });
});
