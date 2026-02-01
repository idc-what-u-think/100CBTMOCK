export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = 'FireKid846/CBT-MOCK';

    const { action, path, content, message, sha } = req.body;

    try {
        if (action === 'fetch') {
            // Fetch file from GitHub
            const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    return res.status(200).json(null);
                }
                throw new Error('Failed to fetch data');
            }

            const data = await response.json();
            const decoded = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
            return res.status(200).json({ content: decoded, sha: data.sha });

        } else if (action === 'update') {
            // Update file on GitHub
            const body = {
                message: message,
                content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64')
            };
            if (sha) body.sha = sha;

            const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update data');
            }

            const result = await response.json();
            return res.status(200).json(result);
        }

        return res.status(400).json({ error: 'Invalid action' });

    } catch (error) {
        console.error('GitHub API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
