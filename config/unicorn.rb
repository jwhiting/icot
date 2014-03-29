# config/unicorn.rb
worker_processes 3
timeout 30
preload_app true

if ENV['RAILS_ENV']=='development'
  listen "127.0.0.1:3000"
else
  listen "/tmp/.icot.unicorn.sock"
  #stderr_path File.expand_path('../log/unicorn.stderr.log',  __FILE__)
  #stdout_path File.expand_path('../log/unicorn.stdout.log',  __FILE__)
  stderr_path "/home/rails/icot/log/unicorn.stderr.log"
  stdout_path "/home/rails/icot/log/unicorn.stdout.log"
end

before_fork do |server, worker|

  Signal.trap 'TERM' do
    puts 'Unicorn master intercepting TERM and sending myself QUIT instead'
    Process.kill 'QUIT', Process.pid
  end

  defined?(ActiveRecord::Base) and
    ActiveRecord::Base.connection.disconnect!

end

after_fork do |server, worker|

  Signal.trap 'TERM' do
    puts 'Unicorn worker intercepting TERM and doing nothing. Wait for master to send QUIT'
  end

  defined?(ActiveRecord::Base) and
    ActiveRecord::Base.establish_connection

  # added this for inspecting the process lifetime in the ops#health controller -jsw
  Icot::Application.config.ops_controller_unicorn_worker_started = Time.now
end
