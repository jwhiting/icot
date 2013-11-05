class Note < ActiveRecord::Base

  belongs_to :task
  belongs_to :user

  before_save :integerize_automated
  def integerize_automated
    self.automated = self.automated.to_i
  end

end

