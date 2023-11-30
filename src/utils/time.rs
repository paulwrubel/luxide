use time::{macros::format_description, OffsetDateTime};

pub fn get_formatted_timestamp_for(now: OffsetDateTime) -> String {
    let format_desc =
        format_description!("[year]-[month]-[day]T[hour repr:12]_[minute]_[second]_[period]");
    now.format(format_desc).expect("Failed to format timestamp")
}
