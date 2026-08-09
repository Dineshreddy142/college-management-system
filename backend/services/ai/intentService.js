export const extractIntentFromResponse = (aiText) => {
    let cleanText = aiText;
    let suggestedAction = null;

    // Look for ```json ... ``` block
    const jsonMatch = aiText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.action === 'NAVIGATE') {
                suggestedAction = parsed;
                // Remove the json block from the text shown to user
                cleanText = aiText.replace(jsonMatch[0], '').trim();
            }
        } catch (e) {
            console.error("Failed to parse intent JSON from AI response", e);
        }
    }

    return { cleanText, suggestedAction };
};
