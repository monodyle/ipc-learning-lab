use byteorder::{LittleEndian, WriteBytesExt};
use serde_json::json;
use std::fs::File;
use std::io::{Error, Write};
use std::os::windows::io::FromRawHandle;
use std::ptr;
use winapi::um::fileapi::CreateFileA;
use winapi::um::handleapi::INVALID_HANDLE_VALUE;
use winapi::um::winbase::WaitNamedPipeA;
use winapi::um::winnt::{FILE_SHARE_READ, FILE_SHARE_WRITE, GENERIC_READ, GENERIC_WRITE};

fn encode(op: i32, data: &serde_json::Value) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let data = serde_json::to_string(data)?;
    let len = data.len();
    let mut packet = vec![0; 8 + len];
    (&mut packet[0..4]).write_i32::<LittleEndian>(op)?;
    (&mut packet[4..8]).write_i32::<LittleEndian>(len as i32)?;
    packet[8..].copy_from_slice(data.as_bytes());
    Ok(packet)
}

fn main() -> Result<(), Error> {
    unsafe {
        let name = std::ffi::CString::new(r"\\?\pipe\ipc-0").unwrap();
        WaitNamedPipeA(name.as_ptr(), 30000);
        let handle = CreateFileA(
            name.as_ptr(),
            GENERIC_READ | GENERIC_WRITE,
            FILE_SHARE_READ | FILE_SHARE_WRITE,
            ptr::null_mut(),
            3,
            0,
            ptr::null_mut(),
        );

        if handle == INVALID_HANDLE_VALUE {
            return Err(Error::last_os_error());
        }

        let mut file = File::from_raw_handle(handle as _);

        file.write_all(&encode(0, &json!({ "clientId": "rust" })).unwrap())?;
    }

    Ok(())
}
