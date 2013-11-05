class AddRankToTasks < ActiveRecord::Migration
  def change
    add_column :tasks, :rank, :integer
  end
end
