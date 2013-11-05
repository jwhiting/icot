class AddNoteCounts < ActiveRecord::Migration
  def up
    add_column :tasks, :note_count, :integer
    add_column :notes, :automated, :integer
  end

  def down
    remove_column :tasks, :note_count
    remove_column :notes, :automated
  end
end
