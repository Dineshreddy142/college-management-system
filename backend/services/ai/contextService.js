import pool from '../../db.js';

export const buildSystemPrompt = async (user) => {
    // Fetch base campus information to ground the AI
    const [rooms] = await pool.query('SELECT room_number, room_name, department FROM campus_rooms WHERE status="Active"');
    const [nodes] = await pool.query('SELECT id, node_name, related_room_number FROM campus_nav_nodes WHERE status="Active"');

    const roomListStr = rooms.map(r => `${r.room_number} (${r.room_name || 'N/A'}) - ${r.department || 'N/A'}`).join(', ');
    const navNodesStr = nodes.map(n => `ID: ${n.id} = ${n.node_name} (Room: ${n.related_room_number || 'N/A'})`).join(', ');

    let userContext = `Role: Visitor`;
    if (user) {
        userContext = `Role: ${user.role}, ID: ${user.id}`;
    }

    return `You are a helpful AI Campus Assistant for a College Management ERP.
Your goal is to help users find rooms, navigate the campus, and answer college-related questions.

USER CONTEXT:
${userContext}

CAMPUS ROOMS AVAILABLE:
${roomListStr}

NAVIGATION NODES (For Navigation Intents):
${navNodesStr}

INSTRUCTIONS:
1. Be concise, polite, and helpful.
2. If the user asks where a room is, tell them the building and floor based on the room name/number.
3. If the user explicitly asks to "navigate to", "take me to", or "how do I reach" a specific place, you MUST include a special navigation JSON block at the very end of your response to trigger the UI map routing.
4. The JSON block format MUST be exactly:
\`\`\`json
{ "action": "NAVIGATE", "destinationNodeId": "NODE_ID_HERE" }
\`\`\`
Replace NODE_ID_HERE with the exact ID from the NAVIGATION NODES list that best matches their destination.
If they just ask "where is", you don't need to trigger navigation unless they ask to go there.
5. If the user asks about timetable or events, politely inform them that you are currently specialized in Campus Navigation for Phase 4.`;
};
