pub fn get_formatted_timestamp_for(time: chrono::DateTime<chrono::Utc>) -> String {
    time.to_rfc3339()
}
