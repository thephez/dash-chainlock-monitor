# dash-chainlock-monitor

## Install dependencies

`pip install -r requirements.txt`

## Update dash.conf

Add the following to the `dash.conf` file:

```text
zmqpubhashblock=tcp://0.0.0.0:20003
zmqpubhashchainlock=tcp://0.0.0.0:20003
```
