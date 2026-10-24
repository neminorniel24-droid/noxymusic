# Privacy

## Camera and microphone
Video and audio are processed on your device. Nothing is sent to a server.

## Songs and recordings
Uploaded songs and your recordings stay in your browser. Downloads go to your own device.

## Saved settings
Instrument, key, scale, effects and theme are saved in your browser's local storage so they are there next visit. Clear site data to remove them.

## Third-party files
The hand and face tracking libraries and models load from public CDNs, which can see your IP address when they are fetched.

## Party mode
If you start or join a party room, the song the DJ plays is sent to the other laptops in the room. It goes through the laptop that created the room, and it is never stored on a server. Camera and microphone never leave your laptop. The free PeerJS server and a STUN server see connection details such as IP addresses while laptops find each other.

If you add a relay (TURN server) for party mode, it carries the room's encrypted traffic between laptops that cannot connect directly. Its provider can see who connected and how much data moved.

If a direct link between laptops fails, party mode uses a relay (the free shared one, or your own). It carries the room's encrypted traffic, and its provider can see who connected and how much data moved. Video sharing is off until you turn on Share my video; your video then goes through the room creator's laptop to the others, and stops when you leave.
