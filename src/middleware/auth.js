const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// List of allowed admin emails
const ADMIN_EMAILS = [
    'your-email@gmail.com'  // Replace with your Gmail address
];

const verifyGoogleToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No authentication token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token with Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        // Check if email is in admin list
        if (!ADMIN_EMAILS.includes(payload.email)) {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Not an admin.'
            });
        }

        // Add user info to request
        req.user = {
            email: payload.email,
            name: payload.name,
            picture: payload.picture
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
};

module.exports = { verifyGoogleToken };
