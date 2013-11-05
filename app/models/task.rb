class Task < ActiveRecord::Base

  has_many :tags
  has_many :notes
  belongs_to :creator, :class_name => User, :foreign_key => :created_by_user_id
  belongs_to :owner, :class_name => User, :foreign_key => :owner_user_id

  STATUS_INBOX = 'inbox'
  STATUS_OPEN = 'open'
  STATUS_IN_PROGRESS = 'in progress'
  STATUS_DEFERRED = 'deferred'
  STATUS_DONE = 'done'
  STATUS_DUPE = 'dupe'
  STATUS_WONTFIX = 'wontfix'
  STATUS_INVALID = 'invalid'
  STATUSES = [
    STATUS_INBOX,
    STATUS_OPEN,
    STATUS_IN_PROGRESS,
    STATUS_DEFERRED,
    STATUS_DONE,
    STATUS_DUPE,
    STATUS_WONTFIX,
    STATUS_INVALID,
  ].freeze

  validates :title, :presence => true
  validates :creator, :presence => true
  validates_inclusion_of :status, :in => STATUSES
  validates :priority, :numericality => true, :allow_nil => true

  #before_validation :set_default_priority
  before_validation :set_default_status

  before_save :set_note_count

  #def set_default_priority
  #  self.priority ||= 0
  #end

  def set_default_status
    self.status ||= STATUS_INBOX
  end

  def set_note_count
    self.note_count = self.notes.select{|n| n.automated.to_i == 0}.length
  end

  def vob_hash(opts = {})
    reload = opts[:reload]
    notes = opts[:notes]
    h = {
      'id' => self.id.to_i,
      'rank' => self.rank.to_i,
      'owner' => (self.owner.try(:name) || 'nobody'),
      'title' => self.title.to_s,
      'priority' => self.priority,
      'created_at' => self.created_at.to_i,
      'status' => self.status.to_s,
      'raw_tags' => self.raw_tags.to_s,
      'tags' => self.raw_tags.to_s.split(/\s+/),
      'num_notes' => self.note_count.to_i,
    }
    if notes
      h['notes'] = self.notes(reload).map{|note|
        { 'id' => note.id.to_i,
          'description' => note.description.to_s,
          'author' => note.user.try(:name).to_s,
          'created_at' => note.created_at.to_i,
          'automated' => (note.automated.to_i == 1),
        }
      }
    end
    return h
  end

end
