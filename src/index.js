import {default as React, Component} from 'react';
import defaultsDeep from 'lodash/fp/defaultsDeep';
import isEqual from 'lodash/isEqual';
import differenceWith from 'lodash/differenceWith';
import vis from 'vis';
import uuid from 'uuid';

class Graph extends Component {
  constructor(props) {
    super(props);
    const {identifier} = props;
    this.updateGraph = this.updateGraph.bind(this);
    this.state = {
      identifier : identifier !== undefined ? identifier : uuid.v4()
    };
  }

  componentDidMount() {
    this.edges = new vis.DataSet();
    this.edges.add(this.props.graph.edges);
    this.nodes = new vis.DataSet();
    this.edges.add(this.props.graph.nodes);
    this.updateGraph();
  }

  shouldComponentUpdate(nextProps, nextState) {
    let nodesChange = !isEqual(this.props.graph.nodes, nextProps.graph.nodes);
    let edgesChange = !isEqual(this.props.graph.edges, nextProps.graph.edges);
    let optionsChange = !isEqual(this.props.options, nextProps.options);
    let eventsChange = !isEqual(this.props.events, nextProps.events);
    
    if (nodesChange) {
      const idIsEqual = (n1, n2) => n1.id === n2.id;
      const nodesRemoved = differenceWith(this.props.graph.nodes, nextProps.graph.nodes, idIsEqual);
      const nodesAdded = differenceWith(nextProps.graph.nodes, this.props.graph.nodes, idIsEqual);
      const nodesChanged = differenceWith(differenceWith(nextProps.graph.nodes, this.props.graph.nodes, isEqual), nodesAdded);
      this.patchNodes({nodesRemoved, nodesAdded, nodesChanged});
    }
    
    if (edgesChange) {
      const edgesRemoved = differenceWith(this.props.graph.edges, nextProps.graph.edges, isEqual);
      const edgesAdded = differenceWith(nextProps.graph.edges, this.props.graph.edges, isEqual);
      this.patchEdges({edgesRemoved, edgesAdded});
    }
    
    if (optionsChange) {
      this.Network.setOptions(nextProps.options);
    }

    if (eventsChange) {
      let events = this.props.events || {}
      for (let eventName of Object.keys(events))
        this.Network.off (eventName, events[eventName])

      events = nextProps.events || {}
      for (let eventName of Object.keys(events))
        this.Network.on (eventName, events[eventName])
    }
    
    return false;
  }

  componentDidUpdate() {
    this.updateGraph();
  }
  
  patchEdges({edgesRemoved, edgesAdded}) {
    this.edges.remove(edgesRemoved);
    this.edges.add(edgesAdded);
  }
  
  patchNodes({nodesRemoved, nodesAdded, nodesChanged}) {
    this.nodes.remove(nodesRemoved);
    this.nodes.add(nodesAdded);
    this.nodes.update(nodesChanged);
  }

  updateGraph() {
    let container = document.getElementById(this.state.identifier);
    let defaultOptions = {
      physics: {
        stabilization: false
      },
      autoResize: false,
      edges: {
        smooth: false,
        color: '#000000',
        width: 0.5,
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.5
          }
        }
      }
    };

    // merge user provied options with our default ones
    let options = defaultsDeep(defaultOptions, this.props.options);

    this.Network = new vis.Network(
      container,
      Object.assign(
        {},
        this.props.graph,
        {
          edges: this.edges,
          nodes: this.nodes
        }
      ),
      options
    );

    if (this.props.getNetwork) {
      this.props.getNetwork(this.Network)
    }

    // Add user provied events to network
    let events = this.props.events || {};
    for (let eventName of Object.keys(events)) {
      this.Network.on(eventName, events[eventName]);
    }
  }

  render() {
    const { identifier } = this.state;
    const { style } = this.props;
    return React.createElement('div',
        {
          id: identifier,
          style
        },
        identifier
      );
  }
}

Graph.defaultProps = {
  graph: {},
  getNetwork: React.PropTypes.function,
  style: { width: '640px', height: '480px' }
};

export default Graph;
