use bytes::{BufMut, BytesMut};
use serde_json::Value;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::windows::named_pipe::{ClientOptions, NamedPipeClient};

#[derive(Debug)]
pub struct MessageInstruction {
    op: i32,
    data: Value,
}

async fn get_ipc() -> NamedPipeClient {
    let path = r"\\.\pipe\ipc-0";
    println!("getIPC {}", path);
    let stream = ClientOptions::new().open(path).unwrap();
    stream
}

fn decode(packet: &[u8]) -> MessageInstruction {
    let op = i32::from_le_bytes([packet[0], packet[1], packet[2], packet[3]]);
    let len = i32::from_le_bytes([packet[4], packet[5], packet[6], packet[7]]) as usize;

    let data: Value = serde_json::from_slice(&packet[8..8 + len]).unwrap();
    MessageInstruction { op, data }
}

fn encode(op: i32, data: Value) -> Vec<u8> {
    let mut packet = BytesMut::with_capacity(8);
    packet.put_i32_le(op);
    let data = serde_json::to_vec(&data).unwrap();
    packet.put_i32_le(data.len() as i32);
    packet.put_slice(&data);
    packet.to_vec()
}

#[tokio::main]
async fn main() {
    let mut stream = get_ipc().await;

    let message = serde_json::json!({
        "clientId": "rust"
    });

    let encoded_message = encode(0, message);
    stream.write_all(&encoded_message).await.unwrap();

    loop {
        let mut buffer = vec![0; 1024];
        stream.read(&mut buffer).await.unwrap();

        let message = decode(&buffer);

        println!(
            "message: {:?}\nop: {:?}\ndata: {:?}\n",
            message, message.op, message.data
        );
    }
}
