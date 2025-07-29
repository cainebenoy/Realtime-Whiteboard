# ✏️ Realtime Whiteboard

A professional, real-time collaborative whiteboard application built with React and Socket.IO. Draw, collaborate, and share ideas instantly with multiple users in real-time.

![Realtime Whiteboard Preview](https://via.placeholder.com/800x400/667eea/ffffff?text=Realtime+Whiteboard+Preview)

## 🚀 Features

### Core Functionality
- **Real-time Collaboration** - Multiple users can draw simultaneously
- **Live Synchronization** - All drawing actions sync instantly across users
- **Drawing Tools** - Brush with customizable size and colors
- **Eraser Tool** - Remove parts of drawings with adjustable eraser size
- **Undo Function** - Step back through drawing history
- **Clear Canvas** - Reset the entire whiteboard
- **Persistent State** - Drawing history maintained during session

### Modern UI/UX
- **Professional Design** - Modern gradient interface with glass-morphism effects
- **Responsive Layout** - Works seamlessly on desktop, tablet, and mobile
- **Intuitive Controls** - Easy-to-use toolbar with visual feedback
- **Color Picker** - Extensive color palette with custom color support
- **Size Presets** - Quick brush/eraser size selection
- **Connection Status** - Live indicator showing connection state
- **Smooth Animations** - Polished micro-interactions throughout

### Technical Features
- **WebSocket Communication** - Real-time bidirectional communication
- **Canvas API** - High-performance HTML5 canvas rendering
- **State Management** - Efficient drawing state synchronization
- **Memory Management** - Optimized for long drawing sessions
- **Error Handling** - Robust error recovery and logging

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** - Modern UI library with hooks
- **Socket.IO Client 4.8.1** - Real-time communication
- **HTML5 Canvas API** - High-performance drawing surface
- **CSS3** - Modern styling with animations and responsive design
- **Inter Font** - Professional typography

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **Socket.IO 4.8.1** - Real-time bidirectional event-based communication
- **CORS** - Cross-origin resource sharing

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/realtime-whiteboard.git
   cd realtime-whiteboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the backend server**
   ```bash
   node server.js
   ```
   Server will run on `http://localhost:3001`

4. **Start the React development server**
   ```bash
   npm start
   ```
   Application will open at `http://localhost:3000`

## 🚀 Usage

1. **Open the application** in your browser at `http://localhost:3000`
2. **Select drawing tools** from the top toolbar
3. **Choose colors** from the color picker dropdown
4. **Adjust brush size** using the size presets or slider
5. **Start drawing** on the canvas
6. **Share the URL** with others for real-time collaboration
7. **Use the eraser** to remove parts of drawings
8. **Undo actions** or clear the entire canvas as needed

## 🏗️ Project Structure

```
realtime-whiteboard/
├── public/
│   └── index.html          # HTML template with loading screen
├── src/
│   ├── components/
│   │   ├── Whiteboard.jsx  # Main drawing component
│   │   ├── Whiteboard.css  # Canvas styling
│   │   ├── Toolbar.jsx     # Control panel component
│   │   └── Toolbar.css     # Toolbar styling
│   ├── App.js              # Main React component
│   ├── App.css             # Global styles
│   ├── index.js            # React entry point
│   └── index.css           # Base CSS reset
├── server.js               # Socket.IO server
├── package.json            # Dependencies and scripts
└── README.md              # Project documentation
```

## 🔧 Configuration

### Server Configuration
The Socket.IO server runs on port 3001 by default. You can modify this in `server.js`:

```javascript
const PORT = process.env.PORT || 3001;
```

### Client Configuration
The React app connects to the server at `http://localhost:3001`. Update the connection URL in `Whiteboard.jsx`:

```javascript
socketRef.current = io('http://localhost:3001');
```

## 🎨 Customization

### Adding New Colors
Modify the color array in `Toolbar.jsx`:

```javascript
const colors = [
  '#000000', '#FFFFFF', '#FF0000', // Add your colors here
];
```

### Adjusting Canvas Size
The canvas automatically resizes to fit the container. Modify the CSS in `Whiteboard.css` for custom dimensions.

### Changing Brush Settings
Default brush sizes can be modified in `Toolbar.jsx`:

```javascript
const brushSizes = [2, 5, 10, 15, 25, 35, 50]; // Customize sizes
```

## 🐛 Troubleshooting

### Common Issues

1. **Canvas appears blank**
   - Ensure both server and client are running
   - Check browser console for WebSocket connection errors

2. **Drawing doesn't sync**
   - Verify server is running on correct port
   - Check network connectivity between devices

3. **Performance issues**
   - Clear browser cache
   - Reduce brush size for better performance
   - Check available memory

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the excellent framework
- Socket.IO team for real-time communication capabilities
- Google Fonts for the Inter typography
- Contributors and testers

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/realtime-whiteboard/issues) section
2. Create a new issue with detailed description
3. Include browser version and error messages

---

**Made with ❤️ by [Your Name]**

*Star ⭐ this repository if you found it helpful!*
