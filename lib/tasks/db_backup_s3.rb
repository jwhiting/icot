require 'shellwords'

desc "Sqlite DB backup and upload to S3"
namespace :s3backup do
  task :doit => [:environment] do
    datestamp = Time.now.strftime("%Y-%m-%d_%H-%M-%S")
    dbconf = Rails.configuration.database_configuration[Rails.env]
    backup_dir = "#{Rails.root}/tmp/db_backups"
    sh "mkdir -p #{backup_dir.shellescape}"
    backup_file = "#{backup_dir}/icot_#{Rails.env}_#{datestamp}.sqlite3.gz"
    prod_db_file = "#{Rails.root}/#{dbconf["database"]}"
    sh "gzip --to-stdout #{prod_db_file.to_s.shellescape} > #{backup_file.to_s.shellescape}"
    basename = File.basename(backup_file)
    s3 = AWS::S3.new(:access_key_id => ENV["DB_BACKUP_AWS_ACCESS_KEY_ID"],:secret_access_key => ENV["DB_BACKUP_AWS_SECRET_ACCESS_KEY"])
    s3.buckets[ENV["DB_BACKUP_S3_BUCKET_NAME"]].objects[basename].write(:file => backup_file)
    File.delete(backup_file)
  end
end
