import {
  forceSimulation,
  forceX,
  forceY,
  forceManyBody,
  forceLink,
} from 'd3-force';

let simulation;
let startLinks;
let linkForce;

console.log('new force simulation worker!');

onmessage = function ({ data }) {
  switch (data.type) {
    case 'initialize': {
      const {
        network: {
          nodes,
          links,
        },
      } = data;

      startLinks = links;

      console.debug('worker:initialize');
      linkForce = forceLink(links).distance(10).strength(1);

      simulation = forceSimulation(nodes)
        .force('link', linkForce)
        .force('charge', forceManyBody())
        .force('x', forceX())
        .force('y', forceY());

      simulation.on('tick', () => {
        console.debug('worker:tick');
        postMessage({
          type: 'tick',
          nodes: simulation.nodes(),
        });
      });

      simulation.on('end', () => {
        console.debug('worker:end');
        postMessage({
          type: 'end',
          nodes: simulation.nodes(),
        });
      });
      break;
    }
    case 'stop': {
      if (!simulation) { return; }
      simulation.stop();
      break;
    }
    case 'update': {
      if (!simulation) { return; }
      const {
        network: {
          nodes,
          links,
        },
      } = data;

      startLinks = links;

// .force('link', null)
// .force('link', forceLink(startLinks).distance(10).strength(1))
// .force('charge', forceManyBody())
// .force('x', forceX())
// .force('y', forceY())

      simulation
        .nodes(nodes);

      // simulation
      //   .force('link').links(links);

      simulation
        .alpha(1)
        .restart();

      // simulation.stop();
      // simulation = forceSimulation(nodes)
      //   .force('charge', forceManyBody())
      //   .force('link', forceLink(links).distance(10).strength(1))
      //   .force('x', forceX())
      //   .force('y', forceY())
      //   .restart();
      break;
    }
    case 'update_node': {
      if (!simulation) { return; }

      const nodes = simulation.nodes().map((node, index) => {
        if (index !== data.index) { return node; }
        return {
          ...node,
          ...data.node,
        };
      });

      console.log('update node');

      // simulation.stop();
      // simulation = forceSimulation(nodes)
      //   .force('charge', forceManyBody())
      //   .force('link', null)
      //   .force('link', forceLink(startLinks).distance(10).strength(1))
      //   .force('x', forceX())
      //   .force('y', forceY())
      //   .restart();

      simulation
        // .force('link', null)
        .nodes(nodes);
      // simulation
        // .force('link', forceLink(startLinks).distance(10).strength(1))
        // .force('link').links(startLinks);
      simulation
      //   .alpha(1)
        .restart();
      break;
    }
    default:
  }
};
