#!/usr/bin/env python
# Copyright (c) 2014-2016 The Bitcoin Core developers
# Copyright (c) 2024 thephez
# Distributed under the MIT software license, see the accompanying
# file COPYING or http://www.opensource.org/licenses/mit-license.php.

import binascii
import zmq
import struct
import sqlite3
import datetime
import queue
import sys
import threading
import time
from Naked.toolshed.shell import execute_js
from Naked.toolshed.shell import muterun_js

port = 20003

# Message queue to hold incoming ZMQ messages
message_queue = queue.Queue()

def create_connection(db_file):
    """ create a database connection to the SQLite database
        specified by db_file
    :param db_file: database file
    :return: Connection object or None
    """
    conn = None
    try:
        conn = sqlite3.connect(db_file)
    except Exception as e:
        print(e)
 
    return conn

def create_table(conn):
    cur = conn.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS blocks(Hash TEXT, ChainLock BOOL, BlockSeenTime TEXT, ChainLockSeenTime TEXT, PRIMARY KEY (Hash))")

def is_existing_block(conn, blockhash):
    cur = conn.cursor()
    with conn:
        for row in cur.execute("SELECT ChainLock FROM blocks WHERE Hash = ?", (blockhash,)):
            return True
        else:
            return False

def insert_block_data(conn, data):
    cur = conn.cursor()
    with conn:
        try:
            cur.execute("INSERT OR IGNORE INTO blocks VALUES(?, ?, ?, ?)", data)
        except Exception as e:
            print(data)
            raise

    # Submit to Platform app
    #data = (blockhash, chainlock_status, block_seen_time, chainlock_seen_time)
    blockhash = data[0]
    chainlock_status = data[1]
    block_seen_time = int(time.mktime(data[2].timetuple()))
    
    if data[3] is not None:
        chainlock_seen_time = int(time.mktime(data[3].timetuple()))
    else:
        chainlock_seen_time = 0

    args = '{} {} {} {}'.format(blockhash, chainlock_status, block_seen_time, chainlock_seen_time)
    # response = execute_js('node/submitBlockData.js', args) # Same as next line but displays stdout, etc.
    response = muterun_js('node/submitBlockData.js', args)
    # print('{} {}'.format(datetime.datetime.now(), response.stdout))
    #print(response.exitcode)
    if response.exitcode == 0:
        pass
        # print(response.stdout)
    else:
        sys.stderr.write(response.stderr)
    
    return True

def update_block_data(conn, data):
    cur = conn.cursor()
    with conn:
        try:
            cur.execute("UPDATE blocks SET Chainlock = ?, ChainLockSeenTime = ? WHERE Hash = ?", data)

            # Submit to Platform app
            #data = (chainlock_status, chainlock_seen_time, blockhash)
            chainlock_status = data[0]
            chainlock_seen_time = int(time.mktime(data[1].timetuple()))
            blockhash = data[2]

            args = '{} {} {}'.format(blockhash, chainlock_status, chainlock_seen_time)

            # UNCOMMENT FOLLOWING FOR PLATFROM
            # response = execute_js('node/updateBlockData.js', args) # Same as next line but displays stdout, etc.
            response = muterun_js('node/updateBlockData.js', args)
            # #print('{} {}'.format(datetime.datetime.now(), response.stdout))
            # ##print(response.exitcode)
            # #if response.exitcode == 0:
            # #    print(response.stdout)
            # #else:
            # #    sys.stderr.write(response.stderr)

        except Exception as e:
            print(data)
            raise
    return True

def is_last_block_chainlocked(conn):
    cur = conn.cursor()
    with conn:
        for row in cur.execute("SELECT Hash, ChainLock, BlockSeenTime FROM blocks ORDER BY BlockSeenTime DESC LIMIT 1"):
            if row[1] == 0:
                message = 'ChainLock not seen for previous block received at: {}\nBlock hash: {}\nhttps://explorer.dash.org/insight/block/{}'.format(row[2], row[0], row[0])
                print(message)
                return False
            else:
                return True        

def process_zmq_message(topic, body, block_seen_time):
    blockhash = binascii.hexlify(body.lstrip(b'\x00')).decode('utf-8')
    print('{}\tTopic received: {}\tData: {:0>64}'.format(block_seen_time, topic, blockhash))

    chainlock_status = False
    chainlock_seen_time = None

    # Set ChainLock Status
    if topic == "hashchainlock":
        chainlock_status = True
        chainlock_seen_time = block_seen_time

    existing_block = is_existing_block(conn, blockhash)
    
    if existing_block:
        # Update Only
        data = (chainlock_status, chainlock_seen_time, blockhash)
        update_block_data(conn, data)
    else:
        # Check if ChainLock was seen for previous block
        # Note: Will produce false failures while Dash Core is syncing 
        is_last_block_chainlocked(conn)

        # Insert
        data = (blockhash, chainlock_status, block_seen_time, chainlock_seen_time)
        insert_block_data(conn, data)


def zmq_listener():
    """Thread function to listen for ZMQ messages and enqueue them."""
    while True:
        msg = zmqSubSocket.recv_multipart()
        received_time = datetime.datetime.utcnow()  # Capture the timestamp when the message is received
        message_queue.put((msg, received_time))  # Add message and timestamp to the queue        


def message_processor():
    """Processes messages sequentially from the queue."""
    while True:
        print("message processor")
        # Wait for a message to be available in the queue
        item = message_queue.get()
        if item is None:
            break  # Exit if we receive a signal to stop
        
        msg, received_time = item  # Unpack the message and timestamp
        topic = msg[0].decode("utf-8")
        body = msg[1]
        sequence = "Unknown"
        
        if len(msg[-1]) == 4:
            msgSequence = struct.unpack('<I', msg[-1])[-1]
            sequence = str(msgSequence)
        
        if topic == "hashblock" or topic == "hashchainlock":
            print(f"Message received at: {received_time}, Topic: {topic}")
            process_zmq_message(topic, body, received_time)  # Process the message with the actual timestamp of processing
      
        # Mark the task as done
        message_queue.task_done()

# Database connection setup
conn = create_connection('dash-chainlock-data.db')
create_table(conn)

# ZMQ Setup
zmqContext = zmq.Context()
zmqSubSocket = zmqContext.socket(zmq.SUB)
zmqSubSocket.setsockopt(zmq.SUBSCRIBE, b"hashblock")
zmqSubSocket.setsockopt(zmq.SUBSCRIBE, b"hashchainlock")
zmqSubSocket.connect("tcp://127.0.0.1:%i" % port)

# Start the listener in a separate thread
listener_thread = threading.Thread(target=zmq_listener)
listener_thread.start()

# Start processing messages sequentially
try:
    message_processor()  # Run the processor in the main thread
except KeyboardInterrupt:
    print("Shutting down...")
finally:
    zmqContext.destroy()
