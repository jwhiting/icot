class Task < ActiveRecord::Base

  has_many :tags
  has_many :notes
  belongs_to :creator, :class_name => User, :foreign_key => :created_by_user_id
  belongs_to :owner, :class_name => User, :foreign_key => :owner_user_id

  STATUS_INBOX = 'inbox'
  STATUS_OPEN = 'open'
  STATUS_DEFERRED = 'deferred'
  STATUS_DONE = 'done'
  STATUS_DUPE = 'dupe'
  STATUS_WONTFIX = 'wontfix'
  STATUS_INVALID = 'invalid'
  STATUSES = [
    STATUS_INBOX,
    STATUS_OPEN,
    STATUS_DEFERRED,
    STATUS_DONE,
    STATUS_DUPE,
    STATUS_WONTFIX,
    STATUS_INVALID,
  ].freeze

  def vob_hash(reload = false)
    {
      'id' => self.id,
      'owner' => self.owner.name,
      'title' => self.title,
      'priority' => self.priority,
      'created' => self.created_at,
      'status' => self.status,
      'tags' => self.tags(reload).map{|t| t.name},
      'notes' => self.notes(reload).map{|note|
        { 'id' => note.id,
          'description' => note.description,
          'author' => note.user.name,
          'created_at' => note.created_at
        }
      },
    }
  end

end
