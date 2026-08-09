import pool from '../db.js';

class PriorityQueue {
    constructor() {
        this.values = [];
    }
    enqueue(val, priority) {
        this.values.push({ val, priority });
        this.sort();
    }
    dequeue() {
        return this.values.shift();
    }
    sort() {
        this.values.sort((a, b) => a.priority - b.priority);
    }
}

export const getGraphData = async (isAccessible) => {
    const [nodes] = await pool.query('SELECT * FROM campus_nav_nodes WHERE status="Active"');
    let query = 'SELECT * FROM campus_nav_edges WHERE status="Active"';
    if (isAccessible) {
        query += ' AND is_accessible=1';
    }
    const [edges] = await pool.query(query);

    const adjacencyList = {};
    nodes.forEach(node => {
        adjacencyList[node.id] = [];
    });

    edges.forEach(edge => {
        if (adjacencyList[edge.from_node]) {
            adjacencyList[edge.from_node].push({ node: edge.to_node, weight: edge.distance });
        }
        if (edge.is_bidirectional && adjacencyList[edge.to_node]) {
            adjacencyList[edge.to_node].push({ node: edge.from_node, weight: edge.distance });
        }
    });

    return { nodes, adjacencyList };
};

export const findShortestPath = async (startId, endId, isAccessible = false) => {
    const { nodes, adjacencyList } = await getGraphData(isAccessible);
    
    const distances = {};
    const previous = {};
    const pq = new PriorityQueue();

    // Init
    for (let nodeId in adjacencyList) {
        if (nodeId === startId) {
            distances[nodeId] = 0;
            pq.enqueue(nodeId, 0);
        } else {
            distances[nodeId] = Infinity;
            pq.enqueue(nodeId, Infinity);
        }
        previous[nodeId] = null;
    }

    let path = [];
    
    while (pq.values.length) {
        let smallest = pq.dequeue().val;
        if (smallest === endId) {
            // Build path
            while (previous[smallest]) {
                path.push(smallest);
                smallest = previous[smallest];
            }
            break;
        }
        if (smallest || distances[smallest] !== Infinity) {
            for (let neighbor in adjacencyList[smallest]) {
                let nextNode = adjacencyList[smallest][neighbor];
                let candidate = distances[smallest] + nextNode.weight;
                let nextNeighbor = nextNode.node;
                
                if (candidate < distances[nextNeighbor]) {
                    distances[nextNeighbor] = candidate;
                    previous[nextNeighbor] = smallest;
                    pq.enqueue(nextNeighbor, candidate);
                }
            }
        }
    }
    
    if (path.length > 0) {
        path = path.concat(startId).reverse();
    } else if (startId === endId) {
        path = [startId];
    }

    // Map path to full node objects
    const pathNodes = path.map(id => nodes.find(n => n.id === id));
    
    const totalDistance = distances[endId] !== Infinity ? distances[endId] : 0;
    
    return { pathNodes, totalDistance };
};

export const generateInstructions = (pathNodes) => {
    if (pathNodes.length <= 1) return ["You have arrived."];
    
    const instructions = [];
    let currentDistance = 0;
    
    for (let i = 0; i < pathNodes.length - 1; i++) {
        const current = pathNodes[i];
        const next = pathNodes[i+1];
        
        const dist = Math.sqrt(Math.pow(current.x - next.x, 2) + Math.pow(current.y - next.y, 2));
        currentDistance += dist;
        
        if (i === 0) {
            instructions.push(`Head towards ${next.node_name || 'next point'} for ${Math.round(dist)} meters.`);
        } else {
            const prev = pathNodes[i-1];
            
            // Calculate angle for turn detection
            const angle1 = Math.atan2(current.y - prev.y, current.x - prev.x);
            const angle2 = Math.atan2(next.y - current.y, next.x - current.x);
            
            let angleDiff = (angle2 - angle1) * (180 / Math.PI);
            
            // Normalize angle diff between -180 and 180
            if (angleDiff > 180) angleDiff -= 360;
            if (angleDiff < -180) angleDiff += 360;
            
            if (Math.abs(angleDiff) > 30) {
                const dir = angleDiff > 0 ? "right" : "left";
                instructions.push(`Turn ${dir}, then walk for ${Math.round(dist)} meters.`);
            } else {
                instructions.push(`Continue straight for ${Math.round(dist)} meters.`);
            }
        }
        
        // Handle floor changes
        if (current.floor_id !== next.floor_id) {
            instructions.push(`Take ${current.node_type} to floor ${next.floor_id}.`);
        }
    }
    
    instructions.push("You have arrived at your destination.");
    
    // Condense instructions (e.g. combine straights)
    // For simplicity, we just return the array
    return instructions;
};
