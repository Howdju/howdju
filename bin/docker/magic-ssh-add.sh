#!/bin/bash
# https://stackoverflow.com/a/42304508/39396

password="$1"

# creates an exe that outputs the password
passout_exe="$PWD/.passout.sh"
install -vm700 <(echo "echo $password") "$passout_exe"

# then the magic happens. NOTE: your DISPLAY variable should be set
# for this method to work (see ssh-add(1))
[[ -z "$DISPLAY" ]] && export DISPLAY=:0
< $HOME/.ssh/id_rsa SSH_ASKPASS="$passout_exe" ssh-add - && shred -n3 -uz "$passout_exe"
