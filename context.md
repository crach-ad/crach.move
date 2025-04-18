# crach.move - Biometric Analysis System

## Project Overview
crach.move is a biometric analysis system designed to visualize and analyze motion tracking data. The application creates a 3D stick figure animation representing human movement, allowing users to study biomechanics and motion patterns.

## Core Components

### Data Structure
- The system uses motion capture data with timestamps, joint positions, rotations, torques, and reaction forces.
- Each joint has a position in 3D space, rotation data, and additional metrics.
- Joints are connected to form a proper human skeleton.
- Data can be uploaded via a JSON file upload functionality, enabling custom motion analysis.

### Visualization
- 3D rendering using Three.js and React Three Fiber.
- Smooth animation with frame interpolation.
- Interactive controls for playback speed, pause/play, and frame stepping.
- Ability to select individual joints for detailed analysis.

### Technical Implementation
- Next.js with TypeScript for the frontend framework.
- Framer Motion for animations.
- Three.js and React Three Fiber for 3D visualization.
- TailwindCSS for styling.

## Features
- 3D visualization of motion data with smooth interpolation
- Enhanced playback controls with prominent play/pause functionality
- Detailed joint information display
- Upload custom JSON motion capture data files with drag-and-drop support
- Reset functionality to return to sample data
- Position and movement controls for manipulating the stick figure in 3D space
- Automatic centering and front-facing view when loading new data
- AI-powered motion analysis through OpenAI integration with concise, friendly responses
- Chat assistant named "Movo" that provides brief, conversational feedback

## Updates
### April 17, 2025
- Enhanced AI assistant conversation style to be concise and casual
- Limited responses to 3-5 sentences for improved readability
- Implemented text-message style communication
- Personalized the assistant with the name "Movo"

## Future Enhancements
- Advanced analytics and comparison features
- Ability to export animations and metrics
- Integration with motion capture devices
- Support for different motion data formats
