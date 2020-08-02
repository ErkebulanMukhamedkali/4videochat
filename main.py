import socketio, uuid
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

sio = socketio.AsyncServer(async_mode='asgi')


@app.get("/")
def root():
    return RedirectResponse(f"/{uuid.uuid4()}")


@app.get("/{room_id}")
async def room(request: Request, room_id: str):
    context = {"request": request, "room_id": room_id}
    return Jinja2Templates(directory="frontend").TemplateResponse(name="index.html", context=context)


@sio.event
async def connect(sid: str, environ):
    print(f'{sid} connected from {environ["HTTP_REFERER"]}')


@sio.on('user-joined')
async def join_room(sid: str, room_id, user_id):
    sio.enter_room(sid, room_id)
    print(sid + " joined room " + room_id)
    await sio.emit('user-joined', data=user_id, room=room_id, skip_sid=sid)

    @sio.on('disconnect')
    async def disconnect(sid: str):
        sio.leave_room(sid, room_id)
        print(sid + " disconnected")
        await sio.emit('user-disconnected', data=user_id, room=room_id, skip_sid=sid)

app.mount("/", socketio.ASGIApp(sio))
