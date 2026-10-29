# Troubleshooting

## The camera does not start
Allow camera access in the address bar. Camera needs HTTPS or localhost.

## There is no sound
Click the page once, then check your volume. Browsers keep audio paused until you interact.

## Hands are not detected
Use good light, keep your hands in view and avoid a busy background.

## Address already in use
Another server is using the port. Run `pkill -f http.server` or use another port such as 8001.

## Filters do not show in the recording
Canvas filters are not supported in Safari. Use Chrome or Edge.

## Party mode: cannot join a room
Check the 4-character code. The room closes when its creator leaves. Some public Wi-Fi stops devices from talking to each other, so try the same home or phone hotspot network. The free PeerJS server is sometimes down: try again in a minute.

## Party mode: one laptop is early or late
Use the Sync nudge slider in the Party tab on that laptop. Bluetooth speakers add delay.

## Party mode: laptops on different networks cannot connect
Some networks block direct links. Open Party, then Connection help, and add free TURN relay details (see docs/PARTY.md). The laptop list shows `direct` or `via relay` once linked. As a quick fix, put the laptop on the same Wi-Fi or phone hotspot as the room creator.

## Party mode: a friend cannot join or keeps dropping
Open Party and press Test under Check my connection on that laptop. If it says the shared relay did not answer, add your own free relay under Connection help (see docs/PARTY.md), or switch that laptop to the same Wi-Fi or hotspot as the room creator. The creator should be the laptop with the best internet.

## Party mode: sound is early or late on one laptop
Look at the line under the room status. If it says In sync, the laptop is within a few milliseconds of the DJ. If the sound is still early or late, a Bluetooth speaker or TV is adding a delay the browser cannot see: move Sync nudge until it lines up. If it keeps saying Adjusting or Catching up, that laptop has a slow or unsteady connection, so try the Check my connection test.
