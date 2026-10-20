<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the user access-exception table and dialogs in a dedicated component, with pure selection and permission rules in a separate helper, to preserve the existing user-detail behavior and test access rules independently.
- Keep inactive-profile handling in the login and authenticated layout, with a user-keyed browser-only profile cache and a shared element-denial component, to avoid silent redirects and repeated profile reads.
