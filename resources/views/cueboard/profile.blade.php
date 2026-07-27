<!-- ============ PROFILE ============ -->
<section class="view" id="view-profile">
  <div class="page-head">
    <div>
      <h2>Profile</h2>
      <p>Manage your account settings.</p>
    </div>
  </div>

  <div class="grid-2">
    <div class="panel">
      <h4>Account Information</h4>

      <form method="POST" action="{{ route('profile.update') }}">
        @csrf
        @method('patch')

        <div class="field">
          <label>Name</label>
          <input type="text" name="name" value="{{ old('name', auth()->user()->name) }}" required>
        </div>

        <div class="field">
          <label>Email</label>
          <input type="email" name="email" value="{{ old('email', auth()->user()->email) }}" required>
        </div>

        <div style="margin-top:16px;">
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    </div>

    <div class="panel">
      <h4>Update Password</h4>

      <form method="POST" action="{{ route('password.update') }}">
        @csrf
        @method('put')

        <div class="field">
          <label>Current Password</label>
          <input type="password" name="current_password" required>
        </div>

        <div class="field">
          <label>New Password</label>
          <input type="password" name="password" required>
        </div>

        <div class="field">
          <label>Confirm Password</label>
          <input type="password" name="password_confirmation" required>
        </div>

        <div style="margin-top:16px;">
          <button type="submit" class="btn btn-primary">Update Password</button>
        </div>
      </form>
    </div>
  </div>
</section>