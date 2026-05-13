# MUVIA: MSKU Campus Navigator & Management Platform

MUVIA is a mobile ecosystem for the Muğla Sıtkı Koçman University (MSKU) campus. It combines campus navigation, AI assistance, and data management into a single platform for students, academics, staff, and visitors.

## Quick Overview

- Campus navigation with point-of-interest routing
- AI assistant for university and campus questions
- Role-based access for different user groups
- Complaint and request tracking for campus operations

## Key Features

**AI-Supported Campus Assistant**
Natural language interaction for academic and campus-related assistance, providing context-aware guidance on university regulations, schedules, and facilities.

**Smart Complaint Management**
NLP-supported automated complaint analysis and intelligent routing, ensuring operational requests reach the relevant administrative or academic units with real-time status tracking.

**Academic Ecosystem**
Centralized management for personalized course schedules, exam calendars, real-time academic announcements, and secure student-to-academic messaging services.

**Campus Social Platform**
Integrated hub for campus-wide events, student club activities, sports participation, and community engagement with interactive social features.

**Accessibility & Personalization**
Advanced support for Dark Mode, blue-light filtering, and high-contrast accessibility modes, including specialized typography for dyslexia and visual optimization.

**Outdoor Campus Navigation**
Precision POI-based outdoor navigation with transportation-aware route planning, covering academic departments, social hubs, and administrative offices.

**Role-Based Experience Design**
Dynamically tailored dashboards and functional modules for Students, Academics, and Visitors, ensuring each user group has access to the tools they need most.

**Smart Nutritional Services**
Digital cafeteria management featuring real-time menu updates, caloric information tracking, and a community-driven meal rating system.

**Intelligent Transportation Tracking**
Real-time monitoring of campus shuttle services, bus frequency tracking, and integrated access to campus taxi lines for streamlined mobility.

**Visitor Orientation Wizard**
An automated, multi-step guidance system for first-time visitors, facilitating seamless discovery of registration points, campus tours, and facility locations.

## System Capabilities & Operational Attributes

- **Real-Time Data Orchestration:** Synchronized state management across messaging, transportation tracking, and event updates for a live, low-latency campus experience.
- **Intelligent Triage & Logic-Based Routing:** Automated analysis of campus complaints using rule-based and NLP techniques to ensure precise departmental delivery and status tracking.
- **Inclusive Accessibility Engine:** Proactive support for diverse user needs, including high-contrast visual modes, dyslexia-friendly typography, and customizable blue-light filtration.
- **Multi-Role Contextualization:** Granular state control that dynamically adapts the entire application interface and feature set based on the user's authenticated role.
- **Localized Multilingual Support:** Robust internationalization (i18n) infrastructure providing full English and Turkish support across all navigational and academic modules.
- **Interactive Geospatial Visualization:** High-accuracy coordinate mapping and POI configuration system allowing for dynamic campus discovery and interactive exploration.
- **Secure Communication Protocols:** Centralized management of student-to-academic interactions within a secure, role-verified messaging environment.
- **Persistent Backend Integrity:** Robust data persistence layer ensuring the security and availability of user profiles, academic schedules, and operational records.

## Technical Architecture and Stack

- **Frontend:** React Native (Expo Framework) - Native performance with cross-platform compatibility.
- **Type Safety:** TypeScript - Scalable and robust codebase architecture.
- **State Management:** Zustand - Optimized, decentralized state management.
- **Routing:** Expo Router - Modern file-based routing architecture.
- **Backend:** Node.js & Express.js - RESTful API services and centralized data processing.
- **UI Customization:** Custom theme engine supporting Dark Mode, Light Mode, and Blue Light Filter.

## Installation and Configuration

To set up the local development environment, execute the following commands in sequence:

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Backend Services:**
   ```bash
   npm run server
   ```

3. **Start the Application:**
   ```bash
   npm run start
   ```

## Directory Structure

```text
├── app/                  # Application pages and routing logic
├── assets/               # Media assets (Images, icons, fonts)
├── components/           # UI components (Map, AI Assistant, Modals)
├── constants/            # Global constants and theme configurations
├── services/             # API integrations and business logic
├── store/                # State management (Zustand) layer
├── server/               # Backend API server files
└── utils/                # Utility functions and data validation
```

## Key Contributions

- **Centralized Campus Services:** Successfully unified academic, social, and administrative functions into a singular, cohesive mobile ecosystem, reducing application fatigue for students and staff.
- **Optimized Operational Efficiency:** Engineered an intelligent triage system for campus-wide complaints, automating the routing of requests to relevant units and faculties to accelerate resolution times.
- **Advanced Intelligent Interaction:** Implemented a context-aware AI assistant and real-time messaging protocols to bridge the communication gap between students, academics, and university administration.
- **Proactive Accessibility Integration:** Developed a comprehensive accessibility engine, featuring high-contrast modes, dyslexia-friendly typography, and assistive technologies to ensure inclusivity for all campus members.
- **Consolidated Communication Frameworks:** Reduced fragmentation by centralizing academic announcements, event calendars, and departmental notifications into a synchronized real-time data stream.
- **Scalable Smart-Campus Architecture:** Established a robust, role-based architecture (RBAC) designed to serve as a modular foundation for future smart-campus integrations and cross-institutional expansion.

## Future Work & Strategic Roadmap

- **Indoor Navigation Infrastructure:** Integration of high-fidelity indoor mapping and floor-level guidance for navigating complex multi-story faculty buildings and administrative blocks.
- **BLE Beacon & Proximity Services:** Implementation of Bluetooth Low Energy (BLE) beacon networks for hyper-local positioning, automated event check-ins, and contextual notification triggers.
- **Augmented Reality (AR) Navigation:** Development of an AR overlay layer to provide real-time directional cues and facility information through an immersive camera-view interface.
- **AI-Driven Path Optimization:** Utilizing machine learning models to provide dynamic routing suggestions based on real-time pedestrian density, weather conditions, and personal accessibility requirements.
- **Administrative Analytics Dashboards:** Creation of advanced data visualization tools for university management to monitor resource allocation, service performance, and campus-wide operational metrics.
- **IoT & Sustainability Integration:** Integration with smart-campus IoT sensors to facilitate real-time monitoring of building occupancy, energy utilization, and environmental sustainability metrics.

## License and Terms of Use

For detailed licensing information, please refer to the `package.json` file. This software is intended for academic and individual development purposes under the specified terms.
