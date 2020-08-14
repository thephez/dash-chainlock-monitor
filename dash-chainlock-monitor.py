#!/usr/bin/env python
# Copyright (c) 2014-2016 The Bitcoin Core developers
# Copyright (c) 2019 thephez
# Distributed under the MIT software license, see the accompanying
# file COPYING or http://www.opensource.org/licenses/mit-license.php.

import binascii
import zmq
import struct
import sqlite3
import datetime
import os

port = 20003

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
    return True

def update_block_data(conn, data):
    cur = conn.cursor()
    with conn:
        try:
            cur.execute("UPDATE blocks SET Chainlock = ?, ChainLockSeenTime = ? WHERE Hash = ?", data)
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
                send_notification(message)
                return False
            else:
                return True        

def process_zmq_message(topic, body):
    block_seen_time = datetime.datetime.utcnow()
    blockhash = binascii.hexlify(body).decode("utf-8")
    print('{}\tTopic received: {}\tData: {}'.format(block_seen_time, topic, blockhash))

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

# Sends a slack notification with the webhook from secret.txt
def send_notification(text):
    print(text)
    secret_file = open("secret.txt", "r")
    if secret_file.mode == 'r':
        secret = secret_file.read()

    os.popen("curl -X POST -H 'Content-type: application/json' --data '{\"text\":\" " + text + " \"}' " + secret)

# Database connection setup
conn = create_connection('dash-chainlock-data.db')
create_table(conn)

# ZMQ Setup
zmqContext = zmq.Context()
zmqSubSocket = zmqContext.socket(zmq.SUB)
zmqSubSocket.setsockopt(zmq.SUBSCRIBE, b"hashblock")
zmqSubSocket.setsockopt(zmq.SUBSCRIBE, b"hashchainlock")
zmqSubSocket.connect("tcp://127.0.0.1:%i" % port)

try:
    while True:
        msg = zmqSubSocket.recv_multipart()
        topic = str(msg[0].decode("utf-8"))
        body = msg[1]
        sequence = "Unknown"

        if len(msg[-1]) == 4:
          msgSequence = struct.unpack('<I', msg[-1])[-1]
          sequence = str(msgSequence)
        
        if topic == "hashblock" or topic == "hashchainlock":
            process_zmq_message(topic, body)
            
except KeyboardInterrupt:
    zmqContext.destroy()
