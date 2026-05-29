# IT Asset Management - Frontend

A modern React + TypeScript frontend application for the IT Asset Management System.

## Features

- ✨ **Login Page**: Email and password authentication with validation
- 🔐 **Forgot Password**: Multi-step password reset flow with OTP verification
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🎨 **Modern UI**: Beautiful gradient design with smooth animations
- 🔌 **API Integration**: Ready to connect with NestJS backend

## Project Structure

```
frontend/
├── public/
│   └── index.html           # HTML template
├── src/
│   ├── components/
│   │   ├── Login/           # Login page component
│   │   │   ├── Login.tsx
│   │   │   └── Login.css
│   │   └── ForgotPassword/  # Forgot password component
│   │       ├── ForgotPassword.tsx
│   │       └── ForgotPassword.css
│   ├── services/
│   │   └── authService.ts   # Authentication API service
│   ├── styles/
│   │   └── index.css        # Global styles
│   ├── App.tsx              # Main app component
│   ├── App.css              # App styles
│   └── index.tsx            # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```bash
REACT_APP_API_URL=http://localhost:3000/api
```

## Running the Application

### Development Mode
```bash
npm start
```
The app will run at `http://localhost:3000`

### Production Build
```bash
npm run build
```

### Run Tests
```bash
npm test
```

## Features Details

### Login Page
- Email validation
- Password visibility toggle
- Error message handling
- Loading states
- Link to forgot password page

### Forgot Password
- **Step 1**: Enter email to request password reset
- **Step 2**: Verify OTP sent to email
- **Step 3**: Set new password with confirmation

## API Integration

The authentication service is configured to communicate with your NestJS backend. The expected endpoints are:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with email and password |
| POST | `/auth/forgot-password` | Request password reset OTP |
| POST | `/auth/verify-otp` | Verify OTP code |
| POST | `/auth/reset-password` | Reset password with OTP |

### Login Response Format
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

## Configuration

### Environment Variables
```
REACT_APP_API_URL=http://localhost:3000/api
```

Update the `REACT_APP_API_URL` in your `.env` file to match your backend URL.

## Available Scripts

- `npm start` - Run development server
- `npm build` - Create production build
- `npm test` - Run tests
- `npm eject` - Eject from create-react-app (irreversible)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Styling

The application uses:
- CSS3 for styling
- Linear gradients for modern look
- CSS flexbox for responsive layout
- Smooth transitions and animations

## Security Features

- Password visibility toggle for better UX
- Input validation on client side
- JWT token storage in localStorage
- Automatic token injection in API requests
- Automatic logout on 401 unauthorized errors

## Next Steps

1. Update `REACT_APP_API_URL` environment variable
2. Implement your backend API endpoints according to the specified format
3. Add protected routes for authenticated users
4. Customize the UI colors and styling as needed
5. Add additional components as needed (dashboard, settings, etc.)

## License

This project is part of the IT Asset Management System.
