class Task < ActiveRecord::Base

  has_many :tags
  belongs_to :creator, :class_name => User, :foreign_key => :created_by_user_id
  belongs_to :owner, :class_name => User, :foreign_key => :owner_user_id

end

