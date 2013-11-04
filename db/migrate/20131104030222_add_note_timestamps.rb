class AddNoteTimestamps < ActiveRecord::Migration
  def up
    add_column :notes, :created_at, :datetime
    add_column :notes, :updated_at, :datetime
  end

  def down
    drop_column :notes, :created_at
    drop_column :notes, :updated_at
  end
end
