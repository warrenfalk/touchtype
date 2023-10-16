{
  description = "Node development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = { self, flake-utils, nixpkgs }:
    # instead of duplicating the same configuration for every system
    # eachDefaultSystem will iterate over the default list of systems
    # and then map the outputs of devShells = { default } to devShells = { <system> = default }
    # 
    flake-utils.lib.eachDefaultSystem
      (system:
        let pkgs = import nixpkgs {
          system = system;
          config = {
            allowUnfree = true;
          };
        };
        in {
          devShells = {
            default = pkgs.mkShellNoCC {
              buildInputs = [
                # put packages for development shells here
                pkgs.nodejs-18_x
                pkgs.yarn
                pkgs.jq
              ];

              shellHook = ''
                export PS1="(touchtype-dev) $PS1"
                export HISTFILE=".bash_history"
              '';
            };
          };
        }
      );
}
