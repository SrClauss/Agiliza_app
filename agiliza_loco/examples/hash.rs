use loco_rs::hash;
fn main() {
    let p = hash::hash_password("senha123").unwrap();
    println!("HASH: {}", p);
}
