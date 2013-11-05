require File.expand_path(File.join(File.dirname(__FILE__), '..', 'config', 'environment'))
require 'csv'

jsw = User.find_by_name('jwhiting')
if !jsw
  jsw = User.new
  jsw.name = 'jwhiting'
  jsw.encrypted_password = 'redacted'
  jsw.save
end
slh = User.find_by_name('stlhood')
if !slh
  slh = User.new
  slh.name = 'stlhood'
  slh.encrypted_password = 'redacted'
  slh.save
end
gdocs = User.find_by_name('gdocs')
if !gdocs
  gdocs = User.new
  gdocs.name = 'gdocs'
  gdocs.encrypted_password = 'no login'
  gdocs.save
end

CSV.foreach('/home/josh/Downloads/icot2.csv', {:headers => true}) do |row|
  next if row['task'].blank?
  next if row['status'].blank?
  next if row['task'] =~ /above this line/
  next if row['task'] =~ /below this line/
  tags = []
  row.to_hash.keys.each do |key|
    if row[key] == 'x'
      tags << key
    end
  end
  tags << row['roadmap'] if row['roadmap'].present?
  tags << 'feedback' if row['feedback'].present?
  puts [row['status'],row['pri'],row['servant'],row['task'],row['notes'],tags].inspect
  task = Task.new
  task.title = row['task']
  task.status = row['status']
  task.priority = row['priority'].to_i if row['priority'].present?
  task.creator = gdocs
  task.owner = jsw if row['servant'] == 'josh'
  task.owner = slh if row['servant'] == 'stephen'
  task.raw_tags = tags.join(" ")
  tags.each do |t|
    tag = Tag.new
    tag.name = t
    task.tags << tag
  end
  if row['notes'].present?
    note = Note.new
    note.description = row['notes']
    note.user = gdocs
    task.notes << note
  end
  task.save
  task.rank = task.id
  task.save
end
