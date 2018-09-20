# ControllServer

## Testbed ControllServer

## APIs

### Explanation

RESTful API을 통하여 추가 하고 싶은 IPcamera를 원하는 컨테이너와 연동하여 ControllServer에서 실행하고 제거 할 수 있습니다.
또한 ControllServer에서 스트리밍 중인 IPCamera의 구성 및 HTTP Proxy Streaming url을 알수 있습니다.

### Feaures

API의 결과는 Json 형식으로 전달 되고 Json 데이터는 'success'와 'result' 두 개의 key 값으로 이루어 집니다.

'success' 데이터는 API의 동작 여부를 확인하는 값으로 요청한 데이터를 찾지 못 하였을 경우 0을 리턴하고 성공적으로 값을 가져 올 경우 1을 뜻합니다.

'result' 데이터는 요청 데이터를 배열 형식으로 값을 저장 하고 있습니다.


### Each API

#### 1. /getCamera

'''
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
'''
