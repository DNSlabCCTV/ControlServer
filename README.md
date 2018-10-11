# ControllServer

## Testbed ControllServer

### Explanation

RESTful API을 통하여 추가 하고 싶은 IPcamera를 원하는 컨테이너와 연동하여 ControllServer에서 실행하고 제거 할 수 있습니다.

또한 ControllServer에서 스트리밍 중인 IPCamera의 구성 및 HTTP Proxy Streaming url을 알수 있습니다.

추가된 컨테이너와 모니터의 데이터는 아래와 같은 데이터 형식으로 저장 됩니다.
'Obox' Key에는 현재 추가된 Obox데이터 값들을 배열로 저장합니다.
obox데이터는 'name', 'container'로 이루어 져있고 name은 해당 obox의 이름, container는 실행 중인 컨테이너의 정보를 리턴합니다.
'container'의 값은 'name', 'type', 'webport', "camera" 값을 가지고 있고 각 컨테이너의 이름, openCCTV 어플리케이션 type, 사용중인 webport, 등록된 camera를 가지고 있다.
'camera'값은 배열 형식으로 컨테이너에 연동된 Ipcamera의 정보를 가지고 있다.
```
{
  "Obox": [{
    "name": "JNU",
    "container": [{
      "name": "containerName",
      "type": "container type",
      "webport": "port the container using",
      "camera": [{
          "name": "cameraName",
          "url": "http proxy url"
        }
      ]
    }]
  }]
}
```

### Return Type

API의 결과는 Json 형식으로 전달 되고 Json 데이터는 'success'와 'result' 두 개의 key 값으로 이루어 집니다.

'success' 데이터는 API의 동작 여부를 확인하는 값으로 요청한 데이터를 찾지 못 하였을 경우 0을 리턴하고 성공적으로 값을 가져 올 경우 1을 뜻합니다.

'result' 데이터는 요청 데이터를 배열 형식으로 값을 저장 하고 있습니다.


### Each API

#### 1. GET /Data

- 저장된 Json 파일의 Obox배열을 리턴합니다.

```
{
    "success": 1,
    "result": [
        {
            "name": "JNU",
            "container": [
                {
                    "name": "containerName",
                    "type": "type",
                    "webport": "80",
                    "camera": [
                        {
                            "name": "cameraName",
                            "url": "http proxy url"
                        }
                    ]
                }
            ]
        }
    ]
}
```

#### 2. GET /getOboxList

- 추가된 Obox의 이름을 배열로 리턴합니다.

```
{
    "success": 1,
    "result": [
        "JNU"
    ]
}
```

#### 3. GET /getCamera

- 현재 모니터링 중인 카메라의 정보를 Obox 별로 리턴합니다.

```
{
    "success": 1,
    "result": [
        {
            "name": "JNU",
            "camera": [
                {
                    "name": "cameraName",
                    "url": "http proxy url",
                    "type": "type"
                }
            ]
        }
    ]
}
```

#### 4. GET /getCameraByObox/:oboxName

- Path에 oboxName을 입력 하므로써 해당 Obox에 연결된 camera의 데이터를 배열 형식으로 리턴합니다.

```
{
    "success": 1,
    "result": [
        {
            "name": "cameraName",
            "url": "http proxy url",
            "type": "type"
        }
    ]
}
```

#### 5. GET /getCameraByOboxAndCamera/:oboxName/:cameraName

- Path에 oboxName과 cameraName을 입력 함으로써 해당 Obox내의 camerName을 가지고 있는 카메라의 데이터를 리턴한다.

```
{
    "success": 1,
    "result": {
        "name": "cameraName",
        "url": "http proxy url",
        "type": "type"
    }
}
```

#### 6. POST /createContainer

- 컨테이너 생성을 하고 해당 컨테이너에 ipcamera의 rtspurl을 등록시키는 함수입니다.
- v2에서는 kerberos만을 지원합니다.
- kerberos의 경우 하나의 카메라만 등록 할 수 있습니다.


- Parameter 정의
 1. image : image키의 값은 'kerberos', 'zoneminder', 'shinobi'를 사용할 수 있습니다.
 2. cameras : cameras키의 값은 사용자가 입력한 카메라 이름을 담은 Array형식 값이여야 합니다.
 3. rtsp : rtsp키의 값은 각 모니터에 등록될 ipcamera의 rtsp url을 담은 Array형식의 값이여야 합니다.
 4. obox : obox키의 값은 등록 할 obox의 이름입니다.

```
{
    "success": 1,
    "result": "making container"
}
```
