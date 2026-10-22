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
- Keep inactive-profile and initial-password handling in the login and authenticated layout, with a shared user-keyed browser-only cache for profile and pending-password status and a shared element-denial component, to avoid silent redirects and repeated access reads. Password completion clears this cache before home navigation.
- Keep password recovery and reset in separate public routes; wait for SDK session initialization and verify the user before reset, reuse shared password rules, and isolate resend timing in a pure helper so access and cooldown behavior remain testable.
