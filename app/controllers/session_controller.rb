require 'bcrypt'

class SessionController < ApplicationController

  # i have not really thought thru all the issues for auth here. is the session
  # encrypted? is is signed/untamperable? does it live beyond a browser restart
  # (remember me functionality)?

  def secure_compare(a, b)
    return false if a.blank? || b.blank? || a.bytesize != b.bytesize
    l = a.unpack "C#{a.bytesize}"
    res = 0
    b.each_byte { |byte| res |= byte ^ l.shift }
    res == 0
  end

  def login
    logger.warn "login, current session: #{session.inspect}"
    user = User.find_by_name(params[:user_name].to_s)
    if user
      check_password = BCrypt::Engine.hash_secret(
        params[:password],
        BCrypt::Password.new(user.encrypted_password).salt)
      if secure_compare(check_password, user.encrypted_password)
        reset_session # thwart session fixation attacks
        session[:user_name] = user.name
        logger.warn "login successful, current session: #{session.inspect}"
        render :json => {:success => true, :user_name => user.name}
        return
      end
    end
    render :json => {:success => false}
  end

  def logout
    logger.warn "logout, current session: #{session.inspect}"
    reset_session
    logger.warn "logout, reset session: #{session.inspect}"
    render :json => {:success => true}
  end

  def whoami
    logger.warn "whoami, current session: #{session.inspect}"
    render :json => {:success => true, :user_name => session[:user_name].to_s}
  end

end
