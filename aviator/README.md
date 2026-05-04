# Aviator Game

A web-based implementation of the popular Aviator crash game with procedural sound effects and mobile optimizations.

## Features

- **Real-time flight simulation** with smooth canvas rendering
- **Procedural audio** generated using Web Audio API
- **Mobile-optimized** performance with reduced complexity on low-end devices
- **Responsive UI** with modern design and animations
- **Auto-cashout** functionality
- **Game history** tracking
- **Last-minute betting** during flight

## Performance Optimizations

The game includes several optimizations for mobile devices:

- **Canvas scaling**: Limited device pixel ratio to 2x on mobile
- **Reduced path points**: Limited to 50 points on mobile vs 100 on desktop
- **Throttled UI updates**: Updates every 300ms on mobile vs 50ms on desktop
- **Multiplier precision**: Reduced to 1 decimal place on mobile for better performance
- **Separate update intervals**: Multiplier display updates every 400ms on mobile vs 100ms on desktop
- **Audio optimizations**: Sounds disabled or reduced frequency on low-end devices
- **Animation disabling**: Heavy CSS animations disabled on low-end mobile devices

## Technical Details

- Built with vanilla JavaScript, HTML5 Canvas, and CSS3
- Uses Web Audio API for sound generation
- **Fixed 60 FPS game loop** independent of display refresh rate
- Responsive design with mobile-first approach
- No external dependencies

### Game Loop Architecture

The game implements a **fixed timestep game loop** that maintains exactly 60 FPS regardless of the display's refresh rate:

- **Logic updates**: Run at fixed 16.67ms intervals (60 FPS)
- **Rendering**: Can be called multiple times per logic update or skipped on slow devices
- **Delta time accumulation**: Prevents frame drops from causing gameplay issues
- **Spiral of death protection**: Caps accumulated time to prevent lag spikes

This ensures consistent gameplay speed across devices with different refresh rates (60Hz, 120Hz, 144Hz, etc.).

### Last-Minute Betting

During flight, players can place bets even after the plane has taken off, allowing for strategic last-minute decisions.

## Controls

- **Bet Amount**: Set your wager amount
- **Place Bet**: Speeds up the countdown timer (doubles speed) or place bets during flight
- **Cash Out**: Collect winnings during flight
- **Auto Cashout**: Set automatic cashout multiplier
- **Mute**: Toggle sound effects

### Countdown Mechanics

- **Normal countdown**: 5 seconds at normal speed
- **Speed boost**: Placing a bet during countdown doubles the speed
- **Last-minute betting**: Bets can be placed even after takeoff
- **Auto-bet**: If no bet is placed by countdown end, uses current bet amount

## Browser Support

Works on all modern browsers with Web Audio API support. Optimized for mobile Chrome and Safari.