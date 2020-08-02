const socket = io();
const videoGrid = document.getElementById('video-grid');
const myPeer = new Peer(undefined, {
   host: 'pegii-dudochnik.herokuapp.com',
   port: '443',
   secure: true
});
const myVideo = document.createElement('video');
myVideo.muted = true;

const peers = {};

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(myVideo, stream);

    myPeer.on('call', call => {
        console.log("called");
        call.answer(stream);

        const video = document.createElement('video');
        call.on('stream', userVideoStream => {
            console.log("call streamed");
           addVideoStream(video, userVideoStream);
        });
    });

    socket.on('user-joined', userId => {
        console.log(userId + " joined the room");
        connectNewUser(userId, stream);
    });
});

socket.on('user-disconnected', userId => {
    console.log(userId + " disconnected");
    if (peers[userId]) peers[userId].close();
});

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videoGrid.append(video);
}

function connectNewUser(userId, stream) {
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        console.log("streaming call");
        addVideoStream(video, userVideoStream)
    });
    call.on('close', () => {
        console.log("closing call");
       video.remove();
    });

    peers[userId] = call;
}

myPeer.on('open', id => {
    console.log("opened peer " + id);
    socket.emit('user-joined', ROOM_ID, id);
});
