// Flattens nodes from an org structure, returning only nodes of type 'Site'
export const flattenNodesSite = (nodes, arr = []) => {
  nodes.forEach(node => {
    if (node.type === 'Site') arr.push(node);
    if (node.children) flattenNodesSite(node.children, arr); // Recursive call
  });
  return arr;
};

// Example of a more generic version if needed later:
// export const flattenNodesGeneric = (nodes, predicate = () => true, arr = []) => {
//   nodes.forEach(node => {
//     if (predicate(node)) arr.push(node);
//     if (node.children) flattenNodesGeneric(node.children, predicate, arr);
//   });
//   return arr;
// }; 